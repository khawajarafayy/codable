import axios from "axios";

export const runCode = async (req, res) => {
  const { source_code, stdin } = req.body;

  try {
    const payload = {
      language: "java",
      version: "*",
      files: [
        {
          name: "Main.java",
          content: source_code,
        },
      ],
      stdin: stdin || "",
    };

    const response = await axios.post("https://emkc.org/api/v2/piston/execute", payload);

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: "Error communicating with Piston",
      error: error.response?.data || error.message,
    });
  }
};