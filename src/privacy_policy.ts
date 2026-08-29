import {html, TemplateResult} from "lit";

// The GDPR privacy policy shared across the Alt-Shift sites. Returns semantic
// markup only; the consuming component supplies the styling, so each site keeps
// its own look while the text stays single-sourced here.
export function privacyPolicy(): TemplateResult {
    return html`
        <h1>Privacy policy</h1>

        <p>This website is built to process as little personal data as possible: it sets no cookies, runs no analytics, embeds no trackers, and loads no third-party resources.</p>

        <h2>Who we are</h2>
        <p>Alt-Shift AB (org. no. 559380-8404), Stockholm, Sweden, is the controller of the processing described here. Contact: <a href="mailto:privacy@altshift.se">privacy@altshift.se</a>.</p>

        <h2>What we process</h2>
        <p><strong>Error logs:</strong> when a request results in an error, we log your IP address together with technical details of the request, such as your browser and the page requested.</p>
        <p><strong>Email:</strong> if you email us, we process your email address and the contents of your message.</p>

        <h2>Why, and on what legal basis</h2>
        <p>We process error logs to operate the website securely and to detect and troubleshoot faults and abuse, based on our legitimate interest in network and information security (Article 6(1)(f) GDPR).</p>
        <p>Email correspondence is processed based on our legitimate interest in handling your enquiry (Article 6(1)(f) GDPR), or to take steps at your request prior to entering into a contract (Article 6(1)(b) GDPR).</p>

        <h2>Retention</h2>
        <p>Logs are deleted automatically after 30 days.</p>
        <p>Email correspondence is kept only as long as needed for the matter at hand.</p>

        <h2>Where the data goes</h2>
        <p>The website runs on Google Cloud in Finland and is delivered through Firebase Hosting's content delivery network, which caches and serves it from locations worldwide. Our email is handled by Google Workspace. Google acts as our processor throughout. Traffic may transit Google's global network; transfers are safeguarded by the EU&ndash;U.S. Data Privacy Framework and standard contractual clauses.</p>
        <p>We do not sell or share your data with anyone for marketing.</p>

        <h2>Your rights</h2>
        <p>You have the right to request access to, rectification or erasure of your personal data, the right to restriction of and objection to processing, and the right to data portability. Note that we generally cannot identify a person from our log data, in which case these rights may not apply (Article 11 GDPR). You also have the right to lodge a complaint with the Swedish Authority for Privacy Protection (<a href="https://www.imy.se" target="_blank">IMY</a>).</p>

        <h2>Changes</h2>
        <p>Changes to this policy are published on this page.</p>
        <p>Last updated: 29 August 2026.</p>
    `;
}
