import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
    const navigate = useNavigate();
    // We include useAuth to ensure context updates if needed, though direct localStorage set is primary
    const { updateAuth } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            try {
                localStorage.setItem("token", token);

                // Decode JWT to get user info
                const payload = JSON.parse(atob(token.split('.')[1]));
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    profile_picture: payload.profile_picture
                };

                localStorage.setItem("user", JSON.stringify(user));


                // Update context to reflect login immediately
                updateAuth(token, user);

                navigate("/dashboard");
            } catch (e) {
                console.error("Failed to decode token", e);
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, []);

    return <p>Signing you in...</p>;
}
