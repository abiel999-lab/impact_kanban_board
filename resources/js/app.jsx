import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "../css/app.css";

const initialTasks = {
  todo: [],
  progress: [],
  review: [],
  done: [],
};

function App() {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("kanbanTasks");
    return saved ? JSON.parse(saved) : initialTasks;
  });
  const [bg, setBg] = useState(localStorage.getItem("kanbanBg") || "#f4f4f4");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    urgency: "Low",
    description: "",
    column: "todo",
  });

  const columnOrder = [
    { id: "todo", title: "To Do" },
    { id: "progress", title: "In Progress" },
    { id: "review", title: "In Review" },
    { id: "done", title: "Done" },
  ];

  // Simpan ke localStorage otomatis
  useEffect(() => {
    localStorage.setItem("kanbanTasks", JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem("kanbanBg", bg);
  }, [bg]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Jika posisi sama, tidak perlu update
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setColumns((prevColumns) => {
      const newColumns = { ...prevColumns };

      // Ambil task dari source
      const sourceTasks = Array.from(newColumns[source.droppableId]);
      const [movedTask] = sourceTasks.splice(source.index, 1);

      // Ambil list task tujuan
      const destTasks =
        source.droppableId === destination.droppableId
          ? sourceTasks
          : Array.from(newColumns[destination.droppableId]);

      // Masukkan task ke posisi baru
      destTasks.splice(destination.index, 0, movedTask);

      // Update state kolom
      newColumns[source.droppableId] =
        source.droppableId === destination.droppableId
          ? destTasks
          : sourceTasks;
      newColumns[destination.droppableId] = destTasks;

      return newColumns;
    });
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    // Pastikan ID selalu unik
    const id = editTask ? editTask.id : crypto.randomUUID();
    const task = { id, ...newTask };

    setColumns((prev) => {
      const updated = { ...prev };

      // Jika edit, hapus task lama dari semua kolom
      if (editTask) {
        for (let col in updated) {
          updated[col] = updated[col].filter((t) => t.id !== id);
        }
      }

      updated[newTask.column] = [...updated[newTask.column], task];

      return updated;
    });

    setShowModal(false);
    setEditTask(null);
    setNewTask({ title: "", urgency: "Low", description: "", column: "todo" });
  };

  const handleDeleteTask = (colId, taskId) => {
    setColumns((prev) => ({
      ...prev,
      [colId]: prev[colId].filter((t) => t.id !== taskId),
    }));
  };

  const handleEditTask = (colId, task) => {
    setEditTask(task);
    setNewTask({ ...task, column: colId });
    setShowModal(true);
  };

  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const handleBackgroundChange = (value) => {
    if (value === "custom") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const newBg = `url(${ev.target.result})`;
          setBg(newBg);
          localStorage.setItem("kanbanBg", newBg);

          // Reset dropdown supaya bisa pilih Custom lagi nanti
          document.querySelector("select").value = "#f4f4f4";
        };
        reader.readAsDataURL(file);

        // reset input supaya bisa pilih file yang sama
        e.target.value = null;
      };
      input.click();
    } else {
      setBg(value);
    }
  };

  return (
    <div
      className="app"
      style={{
        background: bg.startsWith("url") ? undefined : bg,
        backgroundImage: bg.startsWith("url") ? bg : undefined,
        backgroundSize: bg.startsWith("url") ? "100% 100%" : undefined,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          marginBottom: "10px",
          background: "rgba(255, 255, 255, 0.7)",
          padding: "10px 20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          display: "inline-block",
          backdropFilter: "blur(4px)",
        }}
      >
        Impact Kanban Board
      </h1>

      {/* Toolbar */}
      <div className="add-task">
        <button onClick={() => setShowModal(true)}>+ Tambah Task</button>
        <select
          onChange={(e) => handleBackgroundChange(e.target.value)}
          defaultValue={bg}
        >
          <option value="#f4f4f4">Default</option>
          <option value="#dff9fb">Blue Soft</option>
          <option value="#ffeaa7">Yellow Soft</option>
          <option value="#fab1a0">Pink Soft</option>
          <option value="#55efc4">Green Soft</option>
          <option value="custom">Custom Image...</option>
        </select>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {columnOrder.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <div
                  className="kanban-column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2>{col.title}</h2>
                  {columns[col.id].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          className={`task ${task.urgency.toLowerCase()}`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={provided.draggableProps.style}
                        >
                          <strong>{task.title}</strong>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              display: "block",
                              color: "#555",
                            }}
                          >
                            {task.urgency}
                          </span>
                          <p style={{ fontSize: "0.8rem" }}>
                            {truncateText(task.description)}
                          </p>
                          <button
                            className="delete"
                            onClick={() => handleDeleteTask(col.id, task.id)}
                          >
                            ×
                          </button>
                          <button
                            className="edit"
                            onClick={() => handleEditTask(col.id, task)}
                          >
                            ✏
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Modal Tambah/Edit Task */}
      {showModal && (
        <div className="modal-backdrop">
            <div className="modal">
              <button
                className="close-modal"
                onClick={() => setShowModal(false)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "10px",
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                ×
              </button>
            <h3>{editTask ? "Edit Task" : "Tambah Task Baru"}</h3>
            <input
              placeholder="Nama Task"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <textarea
              placeholder="Deskripsi..."
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />
            <select
              value={newTask.urgency}
              onChange={(e) =>
                setNewTask({ ...newTask, urgency: e.target.value })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <select
              value={newTask.column}
              onChange={(e) => setNewTask({ ...newTask, column: e.target.value })}
            >
              {columnOrder.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button onClick={handleAddTask}>
              {editTask ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
