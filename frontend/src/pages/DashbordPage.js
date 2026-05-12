import { Link } from "react-router-dom";

function DashboardPage() {
    return (
        <div style={{ padding: "40px" }}>
            <h1>Student Assistant</h1>
            <p>Main dashboard will be created later.</p>

            <Link to="/calendar">
                <button>Open Calendar</button>
            </Link>
        </div>
    );
}

export default DashboardPage;