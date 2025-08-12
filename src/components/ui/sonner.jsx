import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return <Sonner theme={"light"} className="toaster group" richColors {...props} />;
};

export { Toaster };
