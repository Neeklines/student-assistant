import { useEffect, useState } from 'react';
import { getMeta } from '../../services/metaService';

function Footer() {
    const [meta, setMeta] = useState(null);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const data = await getMeta();
                setMeta(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchMeta();
    }, []);

    return (
        <footer className="text-center text-gray-500 text-sm mt-16 mb-6">

            <p>
                SmartPlan © 2026{' '}
                <a
                    href="https://github.com/Neeklines"
                    className="text-gray-400 hover:text-white transition"
                >
                    Yehor Timofieiev
                </a>
            </p>

            <p className="mt-1">
                <a
                    href="/tos"
                    className="text-gray-400 hover:text-gray-300 transition"
                >
                    Terms of Service
                </a>{' '}
                ·{' '}
                <a
                    href="/privacy"
                    className="text-gray-400 hover:text-gray-300 transition"
                >
                    Privacy Policy
                </a>
            </p>

            {meta?.env === 'dev' && (
                <p className="mt-1 text-gray-600">
                    Running development version
                </p>
            )}

            {meta?.env === 'prod' &&
                meta.version !== 'unknown' &&
                meta.deployed_at_formatted !== 'unknown' && (
                    <p className="mt-1">
                        Running commit{' '}
                        <a
                            href={`https://github.com/student-assistant/commit/${meta.version}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-300 transition"
                        >
                            {meta.version_short}
                        </a>{' '}
                        deployed at {meta.deployed_at_formatted}
                    </p>
                )}

        </footer>
    );
}

export default Footer;