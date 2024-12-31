import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NotFound from "./components/NotFound/NotFound";
import Admin from "./pages/admin/Admin";
import LayoutAdmin from "./layouts/LayoutAdmin";
import "./App.css";
import ListUsers from "./components/Admin/ListUsers/ListUsers";
import ListUserLogs from "./components/Admin/ListUserLogs/ListUserLogs";
import Dashboard from "./components/Admin/Dashboard/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutAdmin />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "list-users",
        element: <ListUsers />,
      },
      {
        path: "list-user-logs",
        element: <ListUserLogs />,
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
