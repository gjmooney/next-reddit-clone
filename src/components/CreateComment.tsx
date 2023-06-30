"use client";

import { FC, useState } from "react";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";

interface CreateCommentProps {}

const CreateComment: FC<CreateCommentProps> = ({}) => {
  const [input, setInput] = useState<string>("");

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="comment">Your comment</Label>
      <div className="mt-2 ">
        <Textarea
          id="comment"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder="What do you think?"
        />
        <div className="mt-2 flex justify-end"></div>
      </div>
    </div>
  );
};

export default CreateComment;
