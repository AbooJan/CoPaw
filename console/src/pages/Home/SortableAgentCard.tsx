import type { HTMLAttributes, ReactNode } from "react";
import { MenuOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./index.module.less";

interface SortableAgentCardProps extends HTMLAttributes<HTMLElement> {
  id: string;
  children: ReactNode;
  dragDisabled?: boolean;
}

export default function SortableAgentCard({
  id,
  children,
  className,
  style,
  dragDisabled = false,
  ...props
}: SortableAgentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const sortableStyle = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mergedClassName = [
    className,
    isDragging ? styles.agentCardDragging : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      {...props}
      ref={setNodeRef}
      className={mergedClassName}
      style={sortableStyle}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label="Drag to reorder agent"
        onClick={(event) => event.stopPropagation()}
        tabIndex={dragDisabled ? -1 : 0}
        aria-disabled={dragDisabled}
        {...(dragDisabled ? {} : { ...attributes, ...listeners })}
      >
        <MenuOutlined />
      </button>
      {children}
    </article>
  );
}
