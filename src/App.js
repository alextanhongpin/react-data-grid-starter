import { useState, useCallback, useEffect, useMemo } from "react";
import ReactDataGrid, { TextEditor, SelectColumn } from "react-data-grid";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import jsonDiff from "json-diff";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import Convert from "ansi-to-html";
import "./App.css";
const convert = new Convert();

const defaultColumns = [
  SelectColumn,
  {
    key: "id",
    name: "ID",
    editor: TextEditor,
  },
  { key: "title", name: " Title", editor: TextEditor },
  {
    key: "count",
    name: "Count",
    editor: TextEditor,
    editorOptions: {
      editOnClick: true,
    },
    formatter(props) {
      return props.row[props.column.key] ?? "";
    },
  },
];

function extractTypes(schema) {
  const properties = schema.properties;
  const result = {};
  for (let key in properties) {
    result[key] = properties[key].type;
  }
  return result;
}

function parseData(schema, data) {
  const types = extractTypes(schema);
  for (let key in types) {
    if (key in data) {
      switch (types[key]) {
        case "string":
          break;
        case "integer":
          data[key] = Number(data[key]);
          break;
        case "boolean":
          if (["false", "0"].includes(data[key])) {
            data[key] = false;
          } else if (["true", "1"].includes(data[key])) {
            data[key] = true;
          }
          break;
        default:
          console.log("unhandled type:", types[key]);
      }
    }
  }
  return data;
}

function App() {
  const [schema, setSchema] = useState();
  const [columns, setColumns] = useState(defaultColumns);
  const [rows, setRows] = useState([
    { id: 0, title: "row1", count: 20, valid: false },
    { id: 1, title: "row2", count: 100, valid: true },
    { id: 2, title: "row3", count: 40, valid: true },
    { id: 3, title: "row4", count: 30, valid: true },
  ]);
  const [originalRows, setOriginalRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState();

  useEffect(() => {
    async function fetchForms() {
      const body = await window.fetch("http://localhost:3000/api/v1/forms");
      const json = await body.json();
      const { schema } = json.data;
      setSchema(schema);
    }

    fetchForms();
  }, []);

  const validator = useMemo(() => {
    if (!schema) return () => {};
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    return { validate, ajv };
  }, [schema]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: function ({ data, meta }) {
            const dataWithErrors = data.map((row) => {
              row = parseData(schema, row);
              validator.validate(row);
              row.error = validator.validate.errors;
              return row;
            });

            // Ensure the new column definition is set first.
            setColumns([
              SelectColumn,
              ...meta.fields.map((key) => ({
                key,
                name: key,
                editor: TextEditor,
                editorOptions: {
                  editOnClick: true,
                },
                formatter({ row, column }) {
                  const error = row.error?.find(
                    (err) => err.instancePath === `/${column.key}`
                  );
                  return error ? (
                    <>
                      {row[column.key]}
                      <span className="error">(!{error.message})</span>
                    </>
                  ) : (
                    row[column.key] ?? ""
                  );
                },
              })),
            ]);

            setOriginalRows(data);
            setRows(dataWithErrors);
          },
        });
      });
    },
    [validator, schema]
  );

  const handleRowsChange = (rows) => {
    const rowsWithError = rows.map((row) => {
      // The `error` field is an additional property and should be ignored from
      // JSON Schema validation.
      const { error: _, ...rest } = row;
      row = parseData(schema, row);
      const valid = validator.validate(rest);
      if (!valid) {
        console.error("handleRowsChangeError:", {
          row,
          errors: validator.validate.errors,
        });
      }
      rest.error = validator.validate.errors;
      return rest;
    });
    setRows(rowsWithError);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = () => {
    const rowWithError = rows.find((row) => row.error);
    if (rowWithError) {
      window.alert("1 or more rows has error");
    }
  };
  const handleRowKeyGetter = (row) => {
    return row.id || row.foo;
  };

  // TODO: Don't allow primary key to change ...
  // rowKeyGetter={(row) => row.id || row.foo}

  return (
    <div>
      <h1>Grid example</h1>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag n drop some files here, or click to select files</p>
        )}
      </div>
      <button onClick={handleSubmit}>Submit</button>

      <ReactDataGrid
        minHeight={150}
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        columns={columns}
        rows={rows}
        rowKeyGetter={handleRowKeyGetter}
        onRowsChange={handleRowsChange}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        rowClass={(row) => row.error && "error"}
      />

      <h4>JSON Schema</h4>
      <code
        style={{
          whiteSpace: "break-spaces",
        }}
      >
        {JSON.stringify(schema, null, 2)}
      </code>

      <h4>Diff</h4>
      <code
        style={{
          whiteSpace: "break-spaces",
        }}
        dangerouslySetInnerHTML={{
          __html: convert.toHtml(
            jsonDiff.diffString(
              originalRows.map(({ error, ...rest }) => rest),
              rows.map(({ error, ...rest }) => rest),
              { color: true }
            )
          ),
        }}
      ></code>
    </div>
  );
}

export default App;
