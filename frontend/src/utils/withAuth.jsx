import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const { userData, isLoading } = useContext(AuthContext);

        useEffect(() => {
            if (!isLoading && !userData) {
                router("/auth");
            }
        }, [userData, isLoading, router]);

        if (isLoading) {
            return null; // Or a spinner
        }

        if (!userData) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;