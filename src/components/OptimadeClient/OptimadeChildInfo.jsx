import { useState, useEffect } from "react";
import { containerStyle } from "../../styles/containerStyles";
import { textNormal, textTiny, textHyperlink } from "../../styles/textStyles";
import { getCustomInfo } from "../../api";

export default function OptimadeChildInfo({ child }) {
  const [providerMeta, setProviderMeta] = useState(null);

  const isCustom = child?.id === "__custom__";

  useEffect(() => {
    if (!isCustom) return;

    async function fetchCustom() {
      const result = await getCustomInfo({ baseUrl: child.base_url });
      if (result?.meta?.provider) {
        setProviderMeta(result.meta.provider);
      }
    }

    fetchCustom();

    return () => {};
  }, [child, isCustom]);

  if (!child) return null;

  // Decide which data to render
  const data = isCustom ? providerMeta : child;

  if (isCustom && !providerMeta) {
    return (
      <div className={`${containerStyle} h-35 overflow-auto ${textTiny}`}>
        <h3 className={`${textNormal} pb-1.5`}>Waiting...</h3>
      </div>
    );
  }

  // Destructure and render
  const { name, description, homepage, base_url, ...otherAttrs } = data;
  const baseUrl = isCustom ? child.base_url : base_url;

  return (
    <div className={`${containerStyle} ${textTiny} h-35 overflow-auto`}>
      <h3
        className={`${textNormal} pb-1.5`}
      >{`Provider information: ${name}`}</h3>
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

      {baseUrl && (
        <p>
          Base url:{" "}
          <a
            href={baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={textHyperlink}
          >
            {baseUrl}
          </a>
        </p>
      )}
    </div>
  );
}
