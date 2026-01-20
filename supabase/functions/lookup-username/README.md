# Lookup Username Edge Function

This Supabase Edge Function securely looks up a user's email address based on their username without exposing the students table to unauthenticated users.

## Deployment

To deploy this function to Supabase, run:

```bash
supabase functions deploy lookup-username
```

## Usage

The function accepts a POST request with the following body:

```json
{
  "username": "test2"
}
```

And returns:

```json
{
  "email": "test2@gmail.com"
}
```

Or an error:

```json
{
  "error": "Username not found"
}
```

## Testing Locally

To test the function locally:

```bash
supabase functions serve lookup-username
```

Then make a request:

```bash
curl -X POST http://localhost:54321/functions/v1/lookup-username \
  -H "Content-Type: application/json" \
  -d '{"username": "test2"}'
```
