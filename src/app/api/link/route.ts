/**
 * This route is for parsing links
 * in the editor to preview them
 */

import axios from "axios";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const href = url.searchParams.get("url");

  if (!href) {
    return new Response("Invalid href", { status: 400 });
  }

  const res = await axios.get(href);

  // Parse data from link to preview
  const titleMatch = res.data.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "";

  const descriptionMatch = res.data.match(
    /<meta name="description" content="(.*?)"/
  );
  const description = descriptionMatch ? descriptionMatch[1] : "";

  const imageMatch = res.data.match(
    /<meta property="og:image" content="(.*?)"/
  );
  const imageUrl = imageMatch ? imageMatch[1] : "";

  // format is what EditorJS expects
  return new Response(
    JSON.stringify({
      success: 1,
      meta: {
        title,
        description,
        image: {
          url: imageUrl,
        },
      },
    })
  );
}
