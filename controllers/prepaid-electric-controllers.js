const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const xml2js = require('xml2js');

const url = 'https://desertretail.co.za:19001/service.asmx';

const confirmCustomer = async (req, res) => {
    const { meterNo, amount, voucherCode, allSuppliers, referenceNum } = req.body;

    if (!meterNo) {
        return res.status(400).json({ message: "A valid meter number is required", ok: false });
    }

    const soapRequestBody = `
                  <x:Envelope
                    xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:rav="http://ravasvend.co.za/">
                    <x:Header/>
                    <x:Body>
                      <rav:ConfirmCustomer>
                        <rav:req>
                        <rav:terminalMsgID>6</rav:terminalMsgID>
                        <rav:terminalID>6</rav:terminalID>
                        <rav:msgID>${referenceNum}</rav:msgID>
                        <rav:authCred>
                        <rav:opName>PayQwicker</rav:opName>
                        <rav:password>1DDx11XoncgB7sf</rav:password>
                        </rav:authCred>
                        <rav:amount>${amount}</rav:amount>
                        <rav:voucherCode>${voucherCode}</rav:voucherCode>
                        <rav:meterIdentifier>
                        <rav:msno>${meterNo}</rav:msno>
                        </rav:meterIdentifier>
                        <rav:allSuppliers>${allSuppliers}</rav:allSuppliers>
                        </rav:req>
                      </rav:ConfirmCustomer>
                    </x:Body>
                  </x:Envelope>`;

    try {
        const response = await fetch(`${url}?op=ConfirmCustomer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/ConfirmCustomer'
            },
            body: soapRequestBody
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();

        xml2js.parseString(responseText, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('Error parsing SOAP response:', err);
                return res.status(500).json({ error: "Error parsing SOAP response" });
            }

            // Ensure the response structure is correct
            if (!result['soap:Envelope'] || !result['soap:Envelope']['soap:Body']) {
                console.error('Unexpected response structure:', result);
                return res.status(500).json({ error: "Unexpected response structure" });
            }

            const confirmCustomerResult = result['soap:Envelope']['soap:Body']['ConfirmCustomerResponse']['ConfirmCustomerResult'];

            return res.status(200).json({
                ok: true,
                data: confirmCustomerResult
            });
        });

    } catch (error) {
        console.error('Request Error:', error.message);
        console.error('Error Details:', {
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({ error: "An error occurred while fetching data from the SOAP API" });
    }
};


const creditVend = async (req, res) => {
    const { meterNo, amount, voucherCode, reqterminalMsgID, reqterminalID, referenceNum } = req.body;

    // Validate input
    if (!meterNo || !amount) {
        return res.status(400).json({ message: "Required fields are missing", ok: false });
    }

    // Define the SOAP request body with actual values
    const soapRequestBody = `
        <x:Envelope
            xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
            xmlns:rav="http://ravasvend.co.za/">
            <x:Header/>
            <x:Body>
                <rav:CreditVend>
                    <rav:req>
                        <rav:terminalMsgID>${reqterminalMsgID || ''}</rav:terminalMsgID>
                        <rav:terminalID>${reqterminalID || ''}</rav:terminalID>
                        <rav:msgID>${referenceNum || ''}</rav:msgID>
                        <rav:authCred>
                            <rav:opName>PayQwicker</rav:opName>
                            <rav:password>1DDx11XoncgB7sf</rav:password>
                        </rav:authCred>
                        <rav:voucherCode>${voucherCode || ''}</rav:voucherCode>
                        <rav:meterIdentifier>
                            <rav:msno>${meterNo}</rav:msno>
                        </rav:meterIdentifier>
                        <rav:purchaseValue>${amount}</rav:purchaseValue>
                        <rav:tender>
                            <rav:tenderType>CASH</rav:tenderType>
                        </rav:tender>
                        <rav:receiptFormat>NONE</rav:receiptFormat>
                    </rav:req>
                </rav:CreditVend>
            </x:Body>
        </x:Envelope>`;

    try {
        // Make the SOAP request
        const response = await fetch(`${url}?op=CreditVend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/CreditVend'
            },
            body: soapRequestBody
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseText = await response.text();

        xml2js.parseString(responseText, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('Error parsing SOAP response:', err);
                return res.status(500).json({ error: "Error parsing SOAP response" });
            }

            // Ensure the response structure is correct
            if (!result['soap:Envelope'] || !result['soap:Envelope']['soap:Body']) {
                console.error('Unexpected response structure:', result);
                return res.status(500).json({ error: "Unexpected response structure" });
            }

            const creditVendResult = result['soap:Envelope']['soap:Body']['CreditVendResponse']['CreditVendResult'];

            return res.status(200).json({
                ok: true,
                data: creditVendResult
            });
        });

    } catch (error) {
        console.error('Request Error:', error.message);
        console.error('Error Details:', {
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({ error: "An error occurred while fetching data from the SOAP API" });
    }
};

const trialCreditVend = async (req, res) => {
    const { meterNo, amount, voucherCode, tender, sgc, krn, ti, at, tt, track2Data, receiptFormat, terminalChannel, terminalCompanyName, terminalOperator } = req.body;

    // Validate input
    if (!meterNo || !amount || !voucherCode || !tender) {
        return res.status(400).json({ message: "Required fields are missing", ok: false });
    }

    // Define the SOAP request body with actual values
    const soapRequestBody = `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <TrialCreditVend xmlns="http://ravasvend.co.za/">
          <req>
            <voucherCode>${voucherCode}</voucherCode>
            <meterIdentifier>
              <msno>${meterNo}</msno>
              <sgc>${sgc || ''}</sgc>
              <krn>${krn || ''}</krn>
              <ti>${ti || ''}</ti>
              <at>${at || ''}</at>
              <tt>${tt || ''}</tt>
              <track2Data>${track2Data || ''}</track2Data>
            </meterIdentifier>
            <purchaseValue>${amount}</purchaseValue>
            <tender>
              <tenderType>${tender.tenderType}</tenderType>
              <tenderPAN>${tender.tenderPAN}</tenderPAN>
              <fromAccount>${tender.fromAccount}</fromAccount>
              <tenderRef>${tender.tenderRef}</tenderRef>
            </tender>
            <receiptFormat>${receiptFormat || 'NONE'}</receiptFormat>
            <terminalChannel>${terminalChannel || ''}</terminalChannel>
            <terminalCompanyName>${terminalCompanyName || ''}</terminalCompanyName>
            <terminalOperator>${terminalOperator || ''}</terminalOperator>
          </req>
        </TrialCreditVend>
      </soap:Body>
    </soap:Envelope>`;

    try {
        // Make the SOAP request
        const response = await axios.post(
            'http://desertretail.co.za/service.asmx',
            soapRequestBody,
            {
                headers: {
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": "http://ravasvend.co.za/TrialCreditVend"
                }
            }
        );

        // Parse the XML response
        xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error parsing SOAP response" });
            }

            // Extract data from the parsed XML
            const trialCreditVendResult = result['soap:Envelope']['soap:Body']['TrialCreditVendResponse']['TrialCreditVendResult'];

            // Handle extraction based on response structure
            const responseData = {
                confirmCustResult: {
                    voucherCode: trialCreditVendResult.confirmCustResult.voucherCode,
                    voucherCodeDetail: trialCreditVendResult.confirmCustResult.voucherCodeDetail,
                    capability: trialCreditVendResult.confirmCustResult.capability,
                    meterIdentifier: trialCreditVendResult.confirmCustResult.meterIdentifier,
                    custDetail: trialCreditVendResult.confirmCustResult.custDetail,
                    utilityDetail: trialCreditVendResult.confirmCustResult.utilityDetail
                },
                customerMsg: trialCreditVendResult.customerMsg,
                standardTokenTx: trialCreditVendResult.standardTokenTx.StandardTokenTx,
                keyChangeTokenTx: trialCreditVendResult.keyChangeTokenTx.KeyChangeTokenTx,
                fixedChargesTx: trialCreditVendResult.fixedChargesTx.FixedChargesTx,
                debtPaymentTx: trialCreditVendResult.debtPaymentTx.DebtPaymentTx,
                receiptFormat: trialCreditVendResult.receiptFormat,
                receipt: trialCreditVendResult.receipt,
                smsreceipt: trialCreditVendResult.smsreceipt,
                TransactionCost: trialCreditVendResult.TransactionCost
            };

            return res.status(200).json({
                ok: true,
                data: responseData
            });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching data from the SOAP API" });
    }
};





module.exports = {
  confirmCustomer,
  creditVend,
  trialCreditVend,
};