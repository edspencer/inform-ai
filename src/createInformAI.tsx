import { InternalInformAIProvider } from './InformAIContext'

type InformAIProvider = (props: {
  onEvent?: (message: string) => void
  children: React.ReactNode
}) => React.ReactElement

export function createInformAI({ onEvent }: { onEvent: (event: any) => void }) {
  const InformAI: InformAIProvider = props => {
    return (
      <InternalInformAIProvider onEvent={onEvent}>
        {props.children}
      </InternalInformAIProvider>
    )
  }

  return InformAI
}
