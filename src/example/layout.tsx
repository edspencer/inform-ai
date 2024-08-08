// import { AIProvider } from './Provider'
import { InformAI, AI } from "./actions";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <AI>
      <InformAI>{children}</InformAI>
    </AI>
  );
}
