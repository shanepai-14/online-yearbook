export default function Footer({ schoolName, year }) {
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 sm:px-6">
                {schoolName} • Class of {year}
            </div>
        </footer>
    );
}
