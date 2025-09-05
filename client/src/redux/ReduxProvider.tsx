"use client";

import { Provider } from "react-redux";
import store from "./store";
import AuthInitializer from "@/components/providers/AuthInitializer";

interface ReduxProviderProps {
  children: React.ReactNode;
}

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
};

export default ReduxProvider;
