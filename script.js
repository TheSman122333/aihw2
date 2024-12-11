const submitButton = document.getElementById('submitButton');
const userQuestion = document.getElementById('userQuestion');
const responseBox = document.getElementById('responseBox');

let selectedFile;

function displayPDFName() {
    const fileInput = document.getElementById('pdfInput');
    if (fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        document.querySelector('.label-file').innerText = fileInput.files[0].name;
    }
}

async function convertPDFtoText() {
    if (!selectedFile) {
        alert('Please select a PDF file first.');
        return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result);

        try {
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let textContent = '';

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContentPage = await page.getTextContent();
                
                // Extract and concatenate all text from the page
                const pageText = textContentPage.items.map(item => item.str).join(' ');
                textContent += `Page ${pageNum}:\n${pageText}\n\n`;
            }

            /*if (textContent.length > 1024){
                alert("This file is too large. In order for the AI to understand it, it must be less than 1024 characters.")
            }*/
            
            //else{document.getElementById('output').textContent = textContent;}

            document.getElementById('output').textContent = textContent;
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Failed to convert the PDF to text.');
        }
    };

    fileReader.readAsArrayBuffer(selectedFile);
}

submitButton.addEventListener('click', async () => {
    const question = userQuestion.value.trim();

    if (!question) {
        responseBox.textContent = "Please type a question before submitting.";
        return;
    }

    // Clear previous response and show a loading message
    responseBox.innerHTML = 'Thinking... 🤔';

    try {
        // Replace this with your Groq API call
        content = document.getElementById('output').textContent;
        const response = await getAIResponse(question + content);
        console.log(question+content)
        responseBox.innerHTML = response;
    } catch (error) {
        responseBox.textContent = 'Oops! Something went wrong. Try again later. ( THIS MOST LIKELY MEANS THE FILE IS TOO LARGE... )';
        console.error('Error:', error);
    }
});

async function getAIResponse(userMessage) {

    const systemMessage = {
        role: "system",
        content: `
            All you do is generate answers for users homework. If the user happens to upload alot of text, please try to create a study guide, with alot of related content from the pdf. If not, then just answer their question normally.
        `
    };
      

      const messages = [
          systemMessage,
          { role: "user", content: userMessage },
      ];

      try {
          const response = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer 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`,
                  },
                  body: JSON.stringify({
                      messages: messages,
                      model: "mixtral-8x7b-32768",
                      stream: false,
                  }),
              }
          );

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const jsonResponse = await response.json();
          return jsonResponse.choices[0].message.content;
      } catch (error) {
          console.error('Error fetching AI response:', error);
          return "Sorry, something went wrong!";
      }
}