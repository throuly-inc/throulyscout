/**
 * Public trust & privacy page.
 *
 * Editable project content describing the controls we enforce. Not a
 * certification claim and not independently verified.
 */
export default function Trust() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-3xl font-semibold">Trust, security & privacy</h1>
      <p className="text-muted-foreground">
        This page summarizes the security and privacy controls throuly enforces today. It is editable project
        content and is not a third-party certification.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Accounts & roles</h2>
        <ul className="list-disc pl-6 text-sm leading-6">
          <li>Roles (Buyer, Seller, Agent, Lender, Admin) are stored server-side and enforced through database row-level security.</li>
          <li>Buyer and Seller access is self-serve. Agent and Lender access requires admin approval through an audited workflow.</li>
          <li>Admin status is never available through the normal product UI and can only be granted via the audited admin path.</li>
          <li>Switching your active workspace never grants you new permissions.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data privacy</h2>
        <ul className="list-disc pl-6 text-sm leading-6">
          <li>Personal contact information (email, phone) is never returned by public directory endpoints. Sharing is opt-in per connection.</li>
          <li>Profile photos are public by design; bucket listing is restricted.</li>
          <li>Account deletion is a soft delete: shared deal records that other authorized parties rely on are preserved.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Application security</h2>
        <ul className="list-disc pl-6 text-sm leading-6">
          <li>Third-party API keys (Stripe, Resend, mapping, AI providers) are stored as server secrets and never reach the browser.</li>
          <li>Premium and quota-limited features are enforced server-side; client changes cannot unlock them.</li>
          <li>Invitations use single-use codes with hashed storage and rate-limited attempts.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Reporting a problem</h2>
        <p className="text-sm">
          Email <a className="underline" href="mailto:security@throuly.com">security@throuly.com</a> with a
          description and steps to reproduce. We do not run a paid bug bounty at this time.
        </p>
      </section>
    </div>
  );
}
