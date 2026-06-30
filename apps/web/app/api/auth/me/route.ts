export async function GET(request: Request) {
  const token = request.headers.get("authorization");

  const res = await fetch("http://localhost:5000/api/auth/me", {
    headers: token ? { authorization: token } : {},
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
