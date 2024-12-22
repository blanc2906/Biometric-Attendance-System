import HashLoader from "react-spinners/HashLoader";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <HashLoader color="#00cdff" />
    </div>
  );
}
