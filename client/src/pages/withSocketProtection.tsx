import React, { ComponentType, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "@/game-logic/useGameContext.tsx";

function withSocketProtection<T extends React.JSX.IntrinsicAttributes>(
  WrappedComponent: ComponentType<T>,
) {
  return (props: T) => {
    const { isConnected } = useGameContext();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isConnected) {
        navigate("/login");
      }
    }, [isConnected, navigate]);

    return isConnected ? <WrappedComponent {...props} /> : null;
  };
}

export default withSocketProtection;
