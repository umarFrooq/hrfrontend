import { useSearchParams } from "react-router-dom";

export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = Object.fromEntries(searchParams.entries());
  return { queryParams, setQueryParams: setSearchParams };
};
