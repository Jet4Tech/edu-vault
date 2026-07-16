export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="prose prose-slate mx-auto max-w-3xl px-4 py-12">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {lastUpdated}</p>

      <p>
        Edu-Vault (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates a marketplace
        connecting teachers and educators who sell educational resources
        (&quot;Sellers&quot;) with buyers (&quot;Buyers&quot;). This Privacy Policy explains
        how we collect, use, and protect your personal information when you use our
        platform.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address, and password
          (handled securely via our authentication provider).
        </li>
        <li>
          <strong>Profile information:</strong> bio, avatar, and other details you
          choose to add to your seller profile.
        </li>
        <li>
          <strong>Payment information:</strong> processed directly by Stripe. We do
          not store your card details. Sellers connect a Stripe account to receive
          payouts.
        </li>
        <li>
          <strong>Transaction data:</strong> purchases, orders, reviews, and basket
          contents associated with your account.
        </li>
        <li>
          <strong>Usage data:</strong> pages visited, searches performed, and similar
          analytics used to improve the platform.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To process payments and deliver purchased digital resources.</li>
        <li>To facilitate payouts to Sellers via Stripe Connect.</li>
        <li>To communicate with you about orders, account activity, and support.</li>
        <li>To maintain the security and integrity of the platform.</li>
      </ul>

      <h2>3. Sharing Your Information</h2>
      <p>
        We share information with third-party service providers strictly as needed
        to operate the platform, including:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — for authentication, database, and file storage.
        </li>
        <li>
          <strong>Stripe</strong> — for payment processing and seller payouts.
        </li>
      </ul>
      <p>
        We do not sell your personal information to third parties. Your name and
        profile information may be visible to other users as part of normal
        marketplace functionality (e.g. seller profiles, reviews).
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your account and transaction data for as long as your account is
        active or as needed to comply with legal obligations, resolve disputes, and
        enforce our agreements.
      </p>

      <h2>5. Your Rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct, or
        delete your personal information, and to object to or restrict certain
        processing. Contact us to exercise these rights.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to maintain your session.
        We do not currently use third-party advertising cookies.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post any
        changes on this page and update the &quot;Last updated&quot; date above.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us through
        the support channels listed on our platform.
      </p>
    </div>
  );
}
