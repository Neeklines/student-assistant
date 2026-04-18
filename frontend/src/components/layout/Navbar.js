import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

                {/* Title */}
                <Link
                    to="/"
                    className="text-white text-2xl font-semibold tracking-tight"
                >
                    SmartPlan
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-3">

                    <Link
                        to="/login"
                        className="text-gray-400 hover:text-white px-3 py-1.5 rounded-md transition"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md font-medium transition"
                    >
                        Register
                    </Link>

                </div>
            </div>
        </nav>
    );
}

export default Navbar;