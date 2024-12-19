import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NotFound from "./components/NotFound/NotFound";
import Admin from "./pages/admin/Admin";
import LayoutAdmin from "./layouts/LayoutAdmin";
import "./App.css";
import ListUsers from "./components/Admin/ListUsers/ListUsers";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutAdmin />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Admin />,
      },
      {
        path: "list-users",
        element: <ListUsers />,
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
