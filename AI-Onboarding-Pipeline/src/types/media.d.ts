// Extends the standard HTMLMediaElement with setSinkId (Audio Output Devices API)
// Not yet in TS lib DOM types, but supported in Chrome 49+, Edge 79+
interface HTMLMediaElement {
  setSinkId?(sinkId: string): Promise<void>;
}
