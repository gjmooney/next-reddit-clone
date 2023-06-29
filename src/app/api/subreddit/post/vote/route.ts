import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { PostVoteValidator } from "@/lib/validators/vote";
import { CachedPost } from "@/types/redis";
import { Post, User, Vote } from "@prisma/client";
import { z } from "zod";

const CACHE_AFTER_UPVOTES = 1;

async function countAndCache(
  post: Post & { author: User; votes: Vote[] },
  postId: string
) {
  // Recount the votes
  const votesAmt = post.votes.reduce((acc, vote) => {
    if (vote.type === "UP") return acc + 1;
    if (vote.type === "DOWN") return acc - 1;
    return acc;
  }, 0);

  if (votesAmt >= CACHE_AFTER_UPVOTES) {
    const cachePayload: CachedPost = {
      authorUsername: post.author.username ?? "",
      content: JSON.stringify(post.content),
      id: post.id,
      title: post.title,
      currentVote: null,
      createdAt: post.createdAt,
    };

    await redis.hset(`post:${postId}`, cachePayload); // Store the post data as a hash
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const { postId, voteType } = PostVoteValidator.parse(body);

    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // check if user has already voted on this post
    const existingVote = await db.vote.findFirst({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        votes: true,
      },
    });

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    if (existingVote) {
      // if vote type is the same as existing vote, delete the vote
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: {
            userId_postId: {
              postId,
              userId: session.user.id,
            },
          },
        });

        await countAndCache(post, postId);

        return new Response("Same vote type: OK");
      }

      // if vote type is different, update the vote
      await db.vote.update({
        where: {
          userId_postId: {
            postId,
            userId: session.user.id,
          },
        },
        data: {
          type: voteType,
        },
      });

      await countAndCache(post, postId);

      return new Response("Different vote type: OK");
    }

    // if no existing vote, create a new vote
    await db.vote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        postId,
      },
    });

    await countAndCache(post, postId);

    return new Response("No existing vote: OK");
  } catch (error) {
    error;
    if (error instanceof z.ZodError) {
      return new Response("Invalid POST request data passed", { status: 422 });
    }

    return new Response(
      "Could not register your vote at this time. Please try later",
      { status: 500 }
    );
  }
}
