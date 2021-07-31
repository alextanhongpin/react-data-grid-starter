import { useState } from "react";
import "./App.css";
import ReactDataGrid, { TextEditor } from "react-data-grid";

const columns = [
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
  const [rows, setRows] = useState([
    { id: 0, title: "row1", count: 20, valid: false },
    { id: 1, title: "row2", count: 100, valid: true },
    { id: 2, title: "row3", count: 40, valid: true },
    { id: 3, title: "row4", count: 30, valid: true },
  ]);
  const [selectedRows, setSelectedRows] = useState();

  return (
    <ReactDataGrid
      minHeight={150}
      columns={columns}
      rows={rows}
      rowKeyGetter={(row) => row.id}
      onRowsChange={setRows}
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows}
      rowClass={(row) => (row.valid ? undefined : "error")}
    />
  );
}

export default App;
