import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="border-b border-gray-700 bg-gray-800/50">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <Link
                    to="/"
                    className="text-white text-2xl font-semibold tracking-tight hover:text-gray-300 transition"
                >
                    SmartPlan
                </Link>
            </div>
        </header>
    );
}

export default Header;