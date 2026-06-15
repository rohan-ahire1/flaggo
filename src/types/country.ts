export type Country = {
  code: string;
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
};

export const getFlagUrl = (code: string) =>
  `https://flagcdn.com/${code.toLowerCase()}.svg`;
