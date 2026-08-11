export default function StubPage({ title, note }: { title: string; note?: string }) {
    return (
        <div className="stub-page">
            <h1>{title}</h1>
            <p className="stub-page__note">
                {note || 'Cette section arrive dans une prochaine phase du projet (voir le phasage M1–M5).'}
            </p>
        </div>
    );
}
