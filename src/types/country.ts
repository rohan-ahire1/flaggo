export type Country = {
  code: string;
  ccn3?: string;
  name: string;
  officialName?: string;
  continent:
    | "Africa"
    | "Americas"
    | "Asia"
    | "Europe"
    | "Oceania"
    | "Antarctic";
  subregion?: string;
  difficulty: "easy" | "medium" | "hard";
  isUNMember: boolean;
  isIndependent: boolean;
  flagUrl: string;
  capital?: string;
  currencyCode?: string;
  currencyName?: string;
  currencySymbol?: string;
  languages?: string[];
  population?: number;
};

export const getFlagUrl = (code: string) =>
  `https://flagcdn.com/${code.toLowerCase()}.svg`;
