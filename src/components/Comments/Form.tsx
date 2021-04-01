import React from "react";
import { useState, ChangeEvent, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FormGroup, Input, Button } from "@material-ui/core";
import Router from "next/router";
import { RemoveCircle } from "@material-ui/icons";

import baseUrl from "../../utils/baseUrl";
import {
  CURRENT_USER,
  IMAGES_BY_COMMENT_ID,
} from "../../apollo/client/queries";
import {
  CREATE_COMMENT,
  UPDATE_COMMENT,
  DELETE_IMAGE,
} from "../../apollo/client/mutations";
import styles from "../../styles/CommentsForm.module.scss";

interface Props {
  postId?: string | number;
  comment?: Comment;
  comments?: Comment[];
  isEditing?: boolean;
  setComments?: (comments: any) => void;
}

const CommentsForm = ({
  postId,
  comment,
  comments,
  isEditing,
  setComments,
}: Props) => {
  const [imagesInputKey, setImagesInputKey] = useState<string>("");
  const [savedImages, setSavedImages] = useState([]);
  const [images, setImages] = useState<File[]>([]);
  const [body, setBody] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const [createComment] = useMutation(CREATE_COMMENT);
  const [updateComment] = useMutation(UPDATE_COMMENT);
  const [deleteImage] = useMutation(DELETE_IMAGE);
  const currentUserRes = useQuery(CURRENT_USER);
  const savedImagesRes = useQuery(IMAGES_BY_COMMENT_ID, {
    variables: { commentId: comment ? comment.id : 0 },
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    if (isEditing) {
      setBody(comment.body);
    }
  }, [comment, isEditing]);

  useEffect(() => {
    setSavedImages(
      savedImagesRes.data ? savedImagesRes.data.imagesByCommentId : []
    );
  }, [savedImagesRes.data]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (currentUserRes.data) {
      setSubmitLoading(true);
      if (isEditing) {
        try {
          setBody("");
          await updateComment({
            variables: {
              id: comment.id,
              body: body,
              images: images,
            },
          });
          // Redirect to Show Post after update
          Router.push(`/posts/${comment.postId}`);
        } catch (err) {
          alert(err);
        }
      } else {
        try {
          setBody("");
          setImages([]);
          e.target.reset();
          const { data } = await createComment({
            variables: {
              userId: currentUserRes.data.user.id,
              postId: postId,
              body: body,
              images: images,
            },
          });
          setComments([...comments, data.createComment.comment]);
        } catch (err) {
          alert(err);
        }
      }
      setSubmitLoading(false);
    }
  };

  const deleteImageHandler = async (id: string) => {
    try {
      await deleteImage({
        variables: {
          id,
        },
      });
      // Removes deleted image from state
      setSavedImages(savedImages.filter((image) => image.id !== id));
    } catch {}
  };

  const removeSelectedImage = (imageName: string) => {
    setImages(
      [...images].filter((image) => {
        return image.name !== imageName;
      })
    );
    setImagesInputKey(Math.random().toString(2));
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className={styles.form}>
      <FormGroup>
        <Input
          type="text"
          placeholder={submitLoading ? "Loading..." : "Leave a comment..."}
          value={body}
          multiline
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setBody(e.target.value)
          }
          style={{
            marginBottom: "12px",
            color: "rgb(170, 170, 170)",
          }}
        />

        <input
          multiple
          type="file"
          accept="image/*"
          key={imagesInputKey}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setImages([...e.target.files])
          }
          style={{ fontSize: "10px", marginBottom: "12px" }}
        />
      </FormGroup>

      <div className={styles.selectedImages}>
        {[...images].map((image) => {
          return (
            <React.Fragment key={image.name}>
              <img
                className={styles.selectedImage}
                src={URL.createObjectURL(image)}
              />

              <RemoveCircle
                style={{ color: "white" }}
                onClick={() => removeSelectedImage(image.name)}
                className={styles.removeSelectedImageButton}
              />
            </React.Fragment>
          );
        })}

        {savedImages.map(({ id, path }) => {
          return (
            <React.Fragment key={id}>
              <img className={styles.selectedImage} src={baseUrl + path} />

              <RemoveCircle
                style={{ color: "white" }}
                onClick={() => deleteImageHandler(id)}
                className={styles.removeSelectedImageButton}
              />
            </React.Fragment>
          );
        })}
      </div>

      <Button
        variant="contained"
        type="submit"
        style={{ color: "white", backgroundColor: "rgb(65, 65, 65)" }}
      >
        {isEditing ? "Save" : "Comment"}
      </Button>
    </form>
  );
};

export default CommentsForm;
