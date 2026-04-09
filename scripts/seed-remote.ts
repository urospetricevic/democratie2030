const appUrl = process.env.APP_URL;
const seedSecret = process.env.SEED_SECRET;

if (!appUrl || !seedSecret) {
  throw new Error("APP_URL and SEED_SECRET must be set.");
}

async function main() {
  const headers = {
    "x-seed-secret": seedSecret as string,
  };

  const response = await fetch(`${appUrl}/api/admin/seed?force=1`, {
    method: "POST",
    headers,
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error(payload);
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));
}

void main();

export {};
