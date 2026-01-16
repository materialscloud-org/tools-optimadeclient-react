import { containerStyle } from "../../styles/containerStyles";
import { textNormal, textTiny, textHyperlink } from "../../styles/textStyles";

export default function OptimadeChildInfo({ child }) {
  if (!child) return;

  if (child.id === "__custom__") {
    return;
  }

  const { name, description, homepage, base_url, ...otherAttrs } = child;

  return (
    <div className={`${containerStyle} ${textTiny} h-35 overflow-auto`}>
      <h3 className={`${textNormal} pb-1.5`}>{name}</h3>
      {description && <p className="pb-1">{description}</p>}
      {homepage && (
        <p>
          Homepage:{" "}
          <a
            href={homepage}
            target="_blank"
            rel="noopener noreferrer"
            className={textHyperlink}
          >
            {homepage}
          </a>
        </p>
      )}

      {base_url && (
        <p>
          Base url:{" "}
          <a
            href={base_url}
            target="_blank"
            rel="noopener noreferrer"
            className={textHyperlink}
          >
            {base_url}
          </a>
        </p>
      )}
    </div>
  );
}
