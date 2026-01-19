import { containerStyle } from "../../styles/containerStyles";
import { textNormal, textTiny, textHyperlink } from "../../styles/textStyles";

export default function OptimadeParentInfo({ provider, providers }) {
  if (!provider || !providers) return null;

  // Find full provider object from providers array by matching base_url
  const fullProvider = providers.find(
    (p) => p.attributes?.base_url === provider.attributes?.base_url,
  );

  if (!fullProvider)
    return (
      <div className={`${containerStyle} h-35 overflow-auto ${textTiny}`}>
        <h3 className={`${textNormal} pb-1.5`}>Unknown top level provider</h3>
        <p>
          This is not neccessarily a problem and usually occurs when using the
          Custom endpoint. Queries will proceed as usual...
        </p>
      </div>
    );

  const { name, description, homepage, base_url, ...otherAttrs } =
    fullProvider.attributes ?? {};

  return (
    <div className={`${containerStyle} h-35 overflow-auto ${textTiny}`}>
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
          Index metadb:{" "}
          <a
            href={`${base_url}/links`}
            target="_blank"
            rel="noopener noreferrer"
            className={textHyperlink}
          >
            {`${base_url}/links`}
          </a>
        </p>
      )}
    </div>
  );
}
