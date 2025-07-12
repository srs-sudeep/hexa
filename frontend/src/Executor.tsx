import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Executor({ action }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (action.action === "navigate") {
      navigate(action.targetPage);
    } else if (action.action === "fill_form") {
      navigate(action.targetPage);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("prefill-form", { detail: action.fields })
        );
      }, 500);
    }
  }, [action]);

  return null;
}