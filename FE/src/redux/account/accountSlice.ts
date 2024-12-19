import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PayloadActionType = {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  user: {
    email: string;
    phone: string;
    fullName: string;
    role: string;
    avatar: string;
    id: string;
  };
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: {
    email: "",
    phone: "",
    fullName: "",
    role: "",
    avatar: "",
    id: "",
  },
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    loginAction: (state, action: PayloadAction<PayloadActionType>) => {
      state.isAuthenticated = true;
      state.isLoading = false;
      state.user = action.payload.user;
    },
    getAccountAction: (state, action: PayloadAction<PayloadActionType>) => {
      state.isAuthenticated = true;
      state.isLoading = false;
      state.user = action.payload.user;
    },
    logoutAction: (state) => {
      state.isAuthenticated = false;
      state.user = {
        email: "",
        phone: "",
        fullName: "",
        role: "",
        avatar: "",
        id: "",
      };
    },
  },
});

export const { loginAction, getAccountAction, logoutAction } =
  accountSlice.actions;

export default accountSlice.reducer;
