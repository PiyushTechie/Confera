import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const { userData, isLoading } = useContext(AuthContext);

        useEffect(() => {
            // Only redirect if we are DONE loading and there is NO user data
            if (!isLoading && !userData) {
                router("/auth");
            }
        }, [userData, isLoading, router]);

        // If still loading (AuthContext handles main loading, but double check here)
        if (isLoading) {
            return null; // Or a spinner
        }

        // If not authenticated, return null (useEffect will trigger redirect)
        if (!userData) {
            return null;
        }

        // If authenticated, render the component
        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;