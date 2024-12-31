import axios from "./axios";

export interface User {
  _id: string;
  id_nvien: string;
  name: string;
  finger_id: number;
  userlog: string[];
  faceDescriptor: string;
  image_path: string;
  __v: number;
}

export interface UserLog {
  id: string;
  user_name: string;
  user_id: string;
  date: string;
  time_in: string;
  time_out: string;
}

export const getUsers = (): Promise<User[]> => {
  return axios.get("/users");
};

export const createNewUser = (records: User): Promise<User> => {
  return axios.post("/users/create-user", records);
};

export const deleteUser = (id: string): Promise<User> => {
  return axios.delete(`/users/${id}`);
};

export const exportExcel = () => {
  return axios.get("/excel-export/download");
};

export const addFaceToUser = (
  userId: string,
  faceImage: FormData
): Promise<User> => {
  return axios.post(`/users/${userId}/add-face`, faceImage, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getUserLogs = () => {
  return axios("/users/logs/all");
};

export const initialCreateUser = () => {
  return axios.post("/users/init-create-user");
};
