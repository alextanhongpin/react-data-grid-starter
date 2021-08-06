import { useState, useCallback } from "react";
import "./App.css";
import ReactDataGrid, { TextEditor, SelectColumn } from "react-data-grid";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import jsonDiff from "json-diff";

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
      const valid = props.row.count >= 0;
      return (
        <span className={valid ? undefined : "error"}>{props.row.count}</span>
      );
    },
  },
];

function App() {
  const [columns, setColumns] = useState(defaultColumns);
  const [rows, setRows] = useState([
    { id: 0, title: "row1", count: 20, valid: false },
    { id: 1, title: "row2", count: 100, valid: true },
    { id: 2, title: "row3", count: 40, valid: true },
    { id: 3, title: "row4", count: 30, valid: true },
  ]);
  const [originalRows, setOriginalRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState();

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      Papa.parse(file, {
        header: true,
        complete: function (results) {
          setOriginalRows(results.data);
          setRows(results.data);
          setColumns([
            SelectColumn,
            ...results.meta.fields.map((key) => ({
              key,
              name: key,
              editor: TextEditor,
            })),
          ]);
          console.log(results);
        },
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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

      <ReactDataGrid
        minHeight={150}
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        columns={columns}
        rows={rows}
        rowKeyGetter={(row) => row.id}
        onRowsChange={setRows}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        rowClass={(row) => (row.valid ? undefined : "error")}
      />
      <code
        style={{
          "white-space": "break-spaces",
        }}
      >
        {jsonDiff.diffString(originalRows, rows, { color: false })}
      </code>
    </div>
  );
}

export default App;
