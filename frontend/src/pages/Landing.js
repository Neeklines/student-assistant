

function Landing() {
    return (
        <div className="bg-gray-900 text-white px-6 py-12 flex items-center justify-center">
            <div className="max-w-4xl mx-auto">
                <div className="rounded-3xl border border-gray-700 bg-gray-950/60 p-10 shadow-xl shadow-black/20">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                        SmartPlan
                    </h1>
                    <p className="mt-4 text-lg sm:text-xl text-gray-300 max-w-3xl">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-gray-900/90 p-5 border border-gray-800">
                            <h2 className="text-xl font-semibold text-white">Lorem ipsum</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-gray-900/90 p-5 border border-gray-800">
                            <h2 className="text-xl font-semibold text-white">Lorem ipsum</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-gray-900/90 p-5 border border-gray-800">
                            <h2 className="text-xl font-semibold text-white">Lorem ipsum</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Landing;