import { ListingForm } from "./listing-form";

export default function NewListingPage() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>List on the Marketplace</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        First time selling? This also sets up your seller profile.
      </p>
      <ListingForm />
    </div>
  );
}
