// Receipt parsing functionality
const receiptParser = {
  // Initialize OCR and receipt parsing
  init: function () {
    // Set up the file upload
    const uploadButton = document.getElementById("receipt-upload-btn");
    const fileInput = document.getElementById("receipt-file-input");

    if (uploadButton && fileInput) {
      uploadButton.addEventListener("click", function () {
        fileInput.click();
      });

      fileInput.addEventListener("change", function (e) {
        if (e.target.files.length > 0) {
          receiptParser.processReceiptFile(e.target.files[0]);
        }
      });
    }

    // Set up drag and drop zone
    const dropZone = document.getElementById("receipt-drop-zone");
    if (dropZone) {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, preventDefaults, false);
      });

      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(
          eventName,
          function () {
            dropZone.classList.add("highlight");
          },
          false
        );
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(
          eventName,
          function () {
            dropZone.classList.remove("highlight");
          },
          false
        );
      });

      dropZone.addEventListener(
        "drop",
        function (e) {
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            receiptParser.processReceiptFile(files[0]);
          }
        },
        false
      );
    }
  },

  // Process the receipt file (image or PDF)
  processReceiptFile: function (file) {
    const modal = document.getElementById("receipt-modal");
    const processingMessage = document.getElementById(
      "receipt-processing-message"
    );
    const previewContainer = document.getElementById("receipt-preview");

    if (modal) {
      modal.style.display = "block";
    }

    if (processingMessage) {
      processingMessage.textContent = "Processing receipt...";
    }

    if (previewContainer) {
      // Clear previous preview
      previewContainer.innerHTML = "";

      // Show a preview of the receipt
      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.classList.add("receipt-preview-img");
        img.file = file;
        previewContainer.appendChild(img);

        const reader = new FileReader();
        reader.onload = (function (aImg) {
          return function (e) {
            aImg.src = e.target.result;
          };
        })(img);
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        const pdfMessage = document.createElement("div");
        pdfMessage.textContent = "PDF Receipt (Preview not available)";
        pdfMessage.classList.add("pdf-message");
        previewContainer.appendChild(pdfMessage);
      }
    }

    // Send the image to Tesseract.js for OCR processing
    this.performOCR(file)
      .then((text) => {
        console.log("Extracted text:", text);

        // Parse the extracted text to find transaction details
        const transactionData = this.parseReceiptText(text);

        if (processingMessage) {
          processingMessage.textContent = "Receipt processed successfully!";
        }

        // Populate the transaction form with extracted data
        this.populateTransactionForm(transactionData);
      })
      .catch((error) => {
        console.error("OCR processing error:", error);
        if (processingMessage) {
          processingMessage.textContent =
            "Error processing receipt. Please try again or enter details manually.";
        }
      });
  },

  // Perform OCR using Tesseract.js (would require the library to be loaded)
  performOCR: function (file) {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would use Tesseract.js
      // For this demo, we'll simulate OCR with a timeout
      setTimeout(() => {
        // We'll use FileReader to read the image file
        const reader = new FileReader();

        reader.onload = function () {
          // This is where we would call Tesseract in a real implementation
          // For now, we'll simulate OCR by parsing the file name
          // In a real implementation, resolve would be called with the OCR result

          // For demo purposes, we'll use filename to determine which sample to use
          if (file.name.toLowerCase().includes("firstbank")) {
            resolve(receiptParser.getSampleFirstBankReceipt());
          } else if (file.name.toLowerCase().includes("barclays")) {
            resolve(receiptParser.getSampleBarclaysReceipt());
          } else if (file.name.toLowerCase().includes("access")) {
            resolve(receiptParser.getSampleAccessReceipt());
          } else {
            // Default sample
            resolve(receiptParser.getSampleFirstBankReceipt());
          }
        };

        reader.onerror = function () {
          reject(new Error("Error reading file"));
        };

        reader.readAsArrayBuffer(file);
      }, 1500); // Simulate processing time
    });
  },

  // Parse the OCR text to extract transaction details
  parseReceiptText: function (text) {
    // Initialize transaction data object
    const transactionData = {
      date: "",
      type: "",
      amount: "",
      description: "",
      sender: "",
      recipient: "",
      bank: "",
    };

    // Extract transaction details using regex patterns
    // Amount
    const amountMatch =
      text.match(/(?:₦|N|\$|£|€)\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i) ||
      text.match(
        /Amount\s*(?::|^)\s*(?:₦|N|\$|£|€)?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i
      );
    if (amountMatch) {
      transactionData.amount = amountMatch[1].replace(/,/g, "");
    }

    // Date
    const dateMatch =
      text.match(
        /Date(?::|^)\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4}|[0-9]{4}[-\/][0-9]{1,2}[-\/][0-9]{1,2})/i
      ) ||
      text.match(
        /([0-9]{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+([0-9]{4})/i
      );
    if (dateMatch) {
      transactionData.date = dateMatch[1];
    }

    // Transaction Type
    const typeMatch = text.match(
      /Transaction\s+Type\s*(?::|^)\s*([A-Za-z\s]+)/i
    );
    if (typeMatch) {
      transactionData.type = typeMatch[1].trim();

      // Determine if it's a sent or received transaction
      if (
        typeMatch[1].toLowerCase().includes("debit") ||
        typeMatch[1].toLowerCase().includes("withdrawal")
      ) {
        transactionData.transactionType = "sent";
      } else if (
        typeMatch[1].toLowerCase().includes("credit") ||
        typeMatch[1].toLowerCase().includes("deposit")
      ) {
        transactionData.transactionType = "received";
      } else {
        // Default to "sent" if unclear
        transactionData.transactionType = "sent";
      }
    }

    // Sender
    const senderMatch =
      text.match(/(?:From|Sender)(?::|^)\s*([A-Za-z\s]+)/i) ||
      text.match(/Sender\s+Name\s*(?::|^)\s*([A-Za-z\s]+)/i);
    if (senderMatch) {
      transactionData.sender = senderMatch[1].trim();
    }

    // Recipient
    const recipientMatch =
      text.match(/(?:To|Beneficiary)(?::|^)\s*([A-Za-z0-9\s]+)/i) ||
      text.match(/Beneficiary\s+Name\s*(?::|^)\s*([A-Za-z\s]+)/i);
    if (recipientMatch) {
      transactionData.recipient = recipientMatch[1].trim();
    }

    // Reference/Description
    const referenceMatch = text.match(
      /(?:Reference|Narration)(?::|^)\s*([A-Za-z0-9\s]+)/i
    );
    if (referenceMatch) {
      transactionData.description = referenceMatch[1].trim();
    }

    // Bank name
    const bankMatch = text.match(
      /(?:Bank|Financial Institution)(?::|^)\s*([A-Za-z\s]+)/i
    );
    if (bankMatch) {
      transactionData.bank = bankMatch[1].trim();
    }

    return transactionData;
  },

  // Populate the transaction form with the extracted data
  populateTransactionForm: function (transactionData) {
    // Get form elements
    const dateInput = document.getElementById("transaction-date");
    const typeSelect = document.getElementById("transaction-type");
    const descriptionInput = document.getElementById("transaction-description");
    const amountInput = document.getElementById("transaction-amount");

    // Populate the form with extracted data
    if (dateInput && transactionData.date) {
      // Convert date to YYYY-MM-DD format if needed
      dateInput.value = transactionData.date;
    }

    if (typeSelect && transactionData.transactionType) {
      typeSelect.value = transactionData.transactionType;
    }

    if (descriptionInput) {
      let description = "";

      if (transactionData.description) {
        description = transactionData.description;
      } else {
        // Construct a description from sender/recipient info
        if (transactionData.transactionType === "sent") {
          description = `Payment to ${
            transactionData.recipient || "recipient"
          }`;
        } else {
          description = `Payment from ${transactionData.sender || "sender"}`;
        }

        if (transactionData.bank) {
          description += ` (${transactionData.bank})`;
        }
      }

      descriptionInput.value = description;
    }

    if (amountInput && transactionData.amount) {
      amountInput.value = transactionData.amount;
    }
  },

  // Sample receipt text templates for testing
  getSampleFirstBankReceipt: function () {
    return `
        Transaction Receipt
        Successful
        ₦ 100,000.00
        One Hundred Thousand Naira Only
        March 07, 2025 21:09:40
        
        From: ******94416
        Sender Name: MERCY NDUKWE
        Beneficiary Name: SUNDAY IGWE NWORIE
        Account No: 1558003121
        Bank: ACCESS BANK PLC
        Transaction Type: Interbank Transfer
        Reference No: 000016250307210842000129806622
        Narration: From Igwe
        `;
  },

  getSampleBarclaysReceipt: function () {
    return `
        BARCLAYS
        
        Amount
        £1,500.00
        
        To
        Adeyemi Adeleye
        xx-xx-82 xxxxxx63
        
        Reference
        From Igwe
        
        From
        CHIBUEZE CAJETAN IGWE
        
        Date created
        03 Mar 2025 - 22:44
        `;
  },

  getSampleAccessReceipt: function () {
    return `
        access
                          Transaction Receipt
        
        Generated from AccessMore on 03/03/25 23:41:25
        
        Transaction Amount    N2,850,000
        Transaction Type      INTER-BANK
        Transaction Date      2025-03-03 23:41:16
        Sender               THE ELITE CREATIVE SOLUTIONS
                             NDUKWE MERCY
        Beneficiary          3121794416
                             First Bank of Nigeria
        Remark               FX
        Transaction Reference NXGUP044011250303234101000017
        Session Id           UP044011250303234101000017
        Transaction Status    Successful
        `;
  },
};

// Initialize the receipt parser when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Check if Tesseract.js is loaded (in production, you'd load this via CDN)
  if (typeof Tesseract === "undefined") {
    console.log("Tesseract.js would be loaded here in production");
    // In production, you'd load Tesseract.js here if it's not already loaded
    // const script = document.createElement('script');
    // script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
    // document.head.appendChild(script);
    // script.onload = function() {
    //     receiptParser.init();
    // };
  } else {
    receiptParser.init();
  }

  // Initialize anyway for this demo
  receiptParser.init();
});
