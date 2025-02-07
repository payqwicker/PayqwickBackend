const { v4: uuidv4 } = require('uuid');
const xml2js = require('xml2js');

const url = 'https://desertretail.co.za:19001/service.asmx';

const User = require("../models/User");

function getCurrentUtcTimestamp() {
  const now = new Date();
  const utcTimestamp = now.getTime();
  return utcTimestamp;
}


const buyAirtime = async (req, res) => {
  const { amount, number, reference, network } = req.body;

  // const user = await User.findById(userId);
  // if (!user) {
  //   return res
  //     .status(400)
  //     .json({ message: "User with this ID does not exist", ok: false });
  // }

  try {
    if (!number) {
        return res.status(400).json({ message: "A valid number is required", ok: false });
    }

    const soapRequestBody = `
                  <x:Envelope
                    xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:rav="http://ravasvend.co.za/">
                    <x:Header/>
                    <x:Body>
                      <rav:LiveAirtime>
                      <rav:req>
                            <rav:terminalMsgID xmlns:rav="http://ravasvend.co.za/">4</rav:terminalMsgID>
                            <rav:terminalID xmlns:rav="http://ravasvend.co.za/">4</rav:terminalID>
                            <rav:msgID xmlns:rav="http://ravasvend.co.za/">${reference}</rav:msgID>
                            <rav:authCred xmlns:rav="http://ravasvend.co.za/">
                            <rav:opName>PayQwicker</rav:opName>
                            <rav:password>1DDx11XoncgB7sf</rav:password>
                            </rav:authCred>
                        <rav:msisdn>${number}</rav:msisdn>
                        <rav:network>${network}</rav:network>
                        <rav:topupType>AIRTIME</rav:topupType>
                        <rav:purchaseValue>${amount}</rav:purchaseValue>
                        <rav:tender>
                          <rav:tenderType>CASH</rav:tenderType>
                          <rav:fromAccount>SAVINGS</rav:fromAccount>
                        </rav:tender>
                        <rav:receiptFormat>NONE</rav:receiptFormat>
                      </rav:req>
                    </rav:LiveAirtime>
                    </x:Body>
                  </x:Envelope>`;

        const response = await fetch(`${url}?op=LiveAirtime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/LiveAirtime'
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

            const liveAirtimeResult = result['soap:Envelope']['soap:Body']['LiveAirtimeResponse']['LiveAirtimeResult'];

            console.log(liveAirtimeResult)
            return res.status(200).json({
                ok: true,
                data: liveAirtimeResult
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
  buyAirtime,
};
