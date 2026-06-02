
import { useState } from "react";
import MainApp from "./MainApp";
import Footer from "../shared/components/Footer";

export default function Index() {
  const [activeTab, setActiveTab] = useState<any>(null);

  return (
    <>
      <MainApp />
      {/* <Footer activeTab={activeTab} setActiveTab={setActiveTab} /> */}
    </>
  );
}
