const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const xml2js = require('xml2js');

const url = 'https://desertretail.co.za:19001/service.asmx';

const dataBundleProviders = async (req, res) => {
    const reference = uuidv4();
    try {
        const soapRequestBody = `
            <x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
                        xmlns:rav="http://ravasvend.co.za/">
                <x:Header/>
                <x:Body>
                    <rav:PinlessVoucherProductList>
                        <rav:req>
                            <rav:terminalMsgID>4</rav:terminalMsgID>
                            <rav:terminalID>4</rav:terminalID>
                            <rav:msgID>${reference}</rav:msgID>
                            <rav:authCred>
                                <rav:opName>PayQwicker</rav:opName>
                                <rav:password>1DDx11XoncgB7sf</rav:password>
                            </rav:authCred>
                            <rav:network></rav:network>
                        </rav:req>
                    </rav:PinlessVoucherProductList>
                </x:Body>
            </x:Envelope>`;

        const response = await axios.post(url, soapRequestBody, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/PinlessVoucherProductList'
            }
        });

        const responseText = response.data;

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

            const pinlessVoucherProductListResult = result['soap:Envelope']['soap:Body']['PinlessVoucherProductListResponse']['PinlessVoucherProductListResult'];

            return res.status(200).json({
                ok: true,
                data: pinlessVoucherProductListResult
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching network providers" });
    }
};

const buyDataBundle = async (req, res) => {
   
    const {referenceNum, network, productCode, voucherCode, voucherValue} = req.body

    try {
        const soapRequestBody = `
            <x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:rav="http://ravasvend.co.za/">
            <x:Header/>
            <x:Body>
                <rav:PinlessVoucherProductList>
                <rav:req>
                    <rav:terminalMsgID xmlns:rav="http://ravasvend.co.za/">4</rav:terminalMsgID>
                    <rav:terminalID xmlns:rav="http://ravasvend.co.za/">4</rav:terminalID>
                    <rav:msgID xmlns:rav="http://ravasvend.co.za/">${referenceNum}</rav:msgID>
                    <rav:authCred xmlns:rav="http://ravasvend.co.za/">
                    <rav:opName>PayQwicker</rav:opName>
                    <rav:password>1DDx11XoncgB7sf</rav:password>
                    </rav:authCred>
                    <rav:network>${network}</rav:network>
                    <rav:productCode>${productCode}</rav:productCode>
                    <rav:voucherCode>${voucherCode}</rav:voucherCode>
                    <rav:purchaseValue>${voucherValue}</rav:purchaseValue>
                    <rav:tender>
                    <rav:tenderType>CASH</rav:tenderType>
                    <rav:tenderPAN>string</rav:tenderPAN>
                    <rav:fromAccount>NONE</rav:fromAccount>
                    <rav:tenderRef>string</rav:tenderRef>
                    </rav:tender>
                    <rav:receiptFormat>NONE</rav:receiptFormat>
                    <rav:terminalChannel>string</rav:terminalChannel>
                    <rav:terminalCompanyName>string</rav:terminalCompanyName>
                    <rav:terminalOperator>string</rav:terminalOperator>
                </rav:req>
                </rav:PinlessVoucherProductList>
            </x:Body>
            </x:Envelope>
            `;

        const response = await axios.post(url, soapRequestBody, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ravasvend.co.za/PinlessVoucherProductList'
            }
        });

        const responseText = response.data;

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

            const pinlessVoucherProductListResult = result['soap:Envelope']['soap:Body']['PinlessVoucherProductListResponse']['PinlessVoucherProductListResult'];

            return res.status(200).json({
                ok: true,
                data: pinlessVoucherProductListResult
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching network providers" });
    }
};

module.exports = {
    dataBundleProviders,
    buyDataBundle
};
