import { useQuery } from "@tanstack/react-query";
import { containerStyle } from "../../styles/containerStyles";
import { textNormal, textTiny, textHyperlink } from "../../styles/textStyles";
import { getCustomInfo } from "../../api";

export default function OptimadeChildInfo({ child }) {
  const isCustom = child?.id === "__custom__";

  const {
    data: customData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["custom-provider-info", child?.base_url],
    queryFn: () => getCustomInfo({ baseUrl: child.base_url }),
    enabled: !!(isCustom && child?.base_url),
    staleTime: 1000 * 60 * 60,
    retry: 0,
  });

  if (!child) return null;

  const providerMeta = isCustom ? customData?.meta?.provider : child;

  if (isCustom && isLoading) {
    return (
      <div
        className={`${containerStyle} ${textTiny} h-35 flex items-center justify-center`}
      >
        <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mr-2" />
        <p>Fetching provider info...</p>
      </div>
    );
  }

  if (isCustom && isError) {
    return (
      <div className={`${containerStyle} ${textTiny} h-25 overflow-auto`}>
        <p className="pb-1">
          Could not retrieve information. Please check if the base URL is
          correct and OPTIMADE-compliant, it's unlikely any queries will
          preceed...
        </p>

        {child?.base_url && (
          <p>
            Submitted url:{" "}
            <a
              href={child.base_url}
              target="_blank"
              rel="noopener noreferrer"
              className={textHyperlink}
            >
              {child.base_url}
            </a>
          </p>
        )}
      </div>
    );
  }

  if (isCustom && !providerMeta) return null;

  const { name, description, homepage, base_url } = providerMeta || {};
  const displayBaseUrl = isCustom ? child.base_url : base_url;

  return (
    <div className={`${containerStyle} ${textTiny} h-35 overflow-auto`}>
      <h3 className={`${textNormal} pb-1.5`}>
        {isCustom ? `Provider information: ${name || "Unknown"}` : `${name}`}
      </h3>

      {description && <p className="pb-1">{description}</p>}

      <div className="space-y-1">
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

        {displayBaseUrl && (
          <p>
            {isCustom ? "Database base url" : "Base url"}:{" "}
            <a
              href={displayBaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={textHyperlink}
            >
              {displayBaseUrl}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
