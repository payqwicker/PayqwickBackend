const { v4: uuidv4 } = require('uuid');
const xml2js = require('xml2js');

const url = 'https://desertretail.co.za:19001/service.asmx';

const User = require("../models/User");



const buyTvCable = async (req, res) => {
  const { smartCardNumber, paymentType, reference } = req.body;

  try {
    if (!smartCardNumber) {
        return res.status(400).json({ message: "A valid smartcard number is required", ok: false });
    }

    const soapRequestBody = `
                  <x:Envelope
                    xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:rav="http://ravasvend.co.za/">
                    <x:Header/>
                    <x:Body>
                      <rav:DSTVGetSubscriberInfo>
                      <rav:req>
                            <rav:terminalMsgID xmlns:rav="http://ravasvend.co.za/">6</rav:terminalMsgID>
                            <rav:terminalID xmlns:rav="http://ravasvend.co.za/">5</rav:terminalID>
                            <rav:msgID xmlns:rav="http://ravasvend.co.za/">${reference}</rav:msgID>
                            <rav:authCred xmlns:rav="http://ravasvend.co.za/">
                            <rav:opName>PayQwicker</rav:opName>
                            <rav:password>1DDx11XoncgB7sf</rav:password>
                            </rav:authCred>
                        <rav:paymentType>${paymentType}</rav:paymentType>
                        <rav:customerIdentifier>${smartCardNumber}</rav:customerIdentifier>
                      </rav:req>
                    </rav:DSTVGetSubscriberInfo>
                    </x:Body>
                  </x:Envelope>`;

        const response = await fetch(`${url}?op=DSTVGetSubscriberInfo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/DSTVGetSubscriberInfo'
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

            const dstvGetSubscriberInfoResult = result['soap:Envelope']['soap:Body']['DSTVGetSubscriberInfoResponse']['DSTVGetSubscriberInfoResult'];

            console.log(dstvGetSubscriberInfoResult)
            return res.status(200).json({
                ok: true,
                data: dstvGetSubscriberInfoResult
            });
        });
  } catch (error) {
    console.error(error.response);

    return res
      .status(500)
      .json({ error: "An error occurred while making the API request" });
  }
}

const dstvVendorPayment = async (req, res) => {
     const { smartCardNumber, paymentType, reference } = req.body;

  try {
    if (!smartCardNumber) {
        return res.status(400).json({ message: "A valid smartcard number is required", ok: false });
    }

    const soapRequestBody = `
                  <x:Envelope
                    xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:rav="http://ravasvend.co.za/">
                    <x:Header/>
                    <x:Body>
                      <rav:DSTVGetSubscriberInfo>
                      <rav:req>
                            <rav:terminalMsgID xmlns:rav="http://ravasvend.co.za/">4</rav:terminalMsgID>
                            <rav:terminalID xmlns:rav="http://ravasvend.co.za/">4</rav:terminalID>
                            <rav:msgID xmlns:rav="http://ravasvend.co.za/">${reference}</rav:msgID>
                            <rav:authCred xmlns:rav="http://ravasvend.co.za/">
                            <rav:opName>PayQwicker</rav:opName>
                            <rav:password>1DDx11XoncgB7sf</rav:password>
                            </rav:authCred>
                        <rav:voucherCode>string</rav:voucherCode>
                        <rav:purchaseValue>decimal</rav:purchaseValue>
                        <rav:paymentFee>decimal</rav:paymentFee>
                        <rav:tender>
                        <rav:tenderType>CASH</rav:tenderType>
                        <rav:fromAccount>NONE</rav:fromAccount>
                        <rav:/tender>
                        <rav:accountNumber>string</rav:accountNumber>
                        <rav:customerAccountStatus>string</rav:customerAccountStatus>
                        <rav:customerInitials>string</rav:customerInitials>
                        <rav:customerSurname>string</rav:customerSurname>
                        <rav:customerCellNo>string</rav:customerCellNo>
                        <rav:customerNumber>string</rav:customerNumber>
                        <rav:paymentAmount>decimal</rav:paymentAmount>
                        <rav:paymentType>string</rav:paymentType>
                        <rav:receiptFormat>NONE</rav:receiptFormat>
                      </rav:req>
                    </rav:DSTVGetSubscriberInfo>
                    </x:Body>
                  </x:Envelope>`;

        const response = await fetch(`${url}?op=DSTVGetSubscriberInfo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/DSTVGetSubscriberInfo'
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

            const dstvGetSubscriberInfoResult = result['soap:Envelope']['soap:Body']['DSTVGetSubscriberInfoResponse']['DSTVGetSubscriberInfoResult'];

            console.log(dstvGetSubscriberInfoResult)
            return res.status(200).json({
                ok: true,
                data: dstvGetSubscriberInfoResult
            });
        });
  } catch (error) {
    console.error(error.response);

    return res
      .status(500)
      .json({ error: "An error occurred while making the API request" });
  }
};

module.exports = {
  buyTvCable,
  dstvVendorPayment
};
