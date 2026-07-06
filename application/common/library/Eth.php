<?php

namespace app\common\library;


use GuzzleHttp\Client;
use think\Config;
use think\Exception;
use Web3\Utils;
use Web3p\EthereumTx\Transaction;

class Eth
{
    public $apikey = "WN84QK7T7SHFA45XZ89X8C81KJDDNBHYM1";
    public $url = "https://api.bscscan.com/";
    public $chainId = 56;
    public function __construct()
    {
//        $this->url = "https://api-testnet.bscscan.com/";
//        $this->chainId = 97;

    }
    /**
     * 每日释放
     */
    public function burnDayPair($contractAddress,$price)
    {
        $data = [
            '0xb45214d2',
            str_pad(Utils::toHex($price), 64, '0', STR_PAD_LEFT),
        ];
        return $this->diyCall($contractAddress,$data);
    }
    /**
     * 兑换cake
     */
    public function exchangeCake($contractAddress,$id,$price)
    {
        $data = [
            '0x4c6d5d71',
            str_pad(Utils::toHex($id), 64, '0', STR_PAD_LEFT),
            str_pad(Utils::toHex($price), 64, '0', STR_PAD_LEFT),
        ];
        return $this->diyCall($contractAddress,$data);
    }
    /**
     * 兑换代币
     */
    public function exchangeDaibi($contractAddress,$id,$price)
    {
        $data = [
            '0xd4b7eac3',
            str_pad(Utils::toHex($id), 64, '0', STR_PAD_LEFT),
            str_pad(Utils::toHex($price), 64, '0', STR_PAD_LEFT),
        ];
        return $this->diyCall($contractAddress,$data);
    }
    /**
     * 系统添加lp 分红
     */
    public function winningPool($contractAddress,$id,$price)
    {
        $data = [
            '0x715dd775',
            str_pad(Utils::toHex($id), 64, '0', STR_PAD_LEFT),
            str_pad(Utils::toHex($price), 64, '0', STR_PAD_LEFT),
        ];
        return $this->diyCall($contractAddress,$data);
    }
    /**
     * 用户添加LP
     */
    public function userAddLp($contractAddress,$id,$price,$address)
    {
        $data = [
            '0xfcb2847d',
            str_pad(Utils::toHex($id), 64, '0', STR_PAD_LEFT),
            str_pad(Utils::toHex($price), 64, '0', STR_PAD_LEFT),
            str_pad(strtolower(str_replace('0x', '', $address)), 64, '0', STR_PAD_LEFT)
        ];
        return $this->diyCall($contractAddress,$data);
    }
    /**
     * @param string $contractAddress 合约地址
     * @param array $data 数据
     */
    public function diyCall($contractAddress, $data) {
        $fromAddress = Config::get("site.user_address");
        $nonce = $this->getNonce($fromAddress);
        $fromAddressKey = Config::get("site.user_address_key");
        $fromAddressKey = Aes::decrypt($fromAddressKey);
        if(empty($fromAddressKey)){
            throw new Exception(__("地址私钥异常"));
        }
        $gasPrice = Utils::toHex(Utils::toWei('20', 'gwei'), true);
        $gasLimit = Utils::toHex('1000000', true);

        $txData = [
            'nonce' => $nonce,
            'from' => strtolower($fromAddress),
            'to' => strtolower($contractAddress),
            'gas' => $gasLimit,
            'gasPrice' => $gasPrice,
            'chainId' => $this->chainId,
            'value' => '0x0',
            'data' => implode('', $data)
        ];
        $transaction = new Transaction($txData);
        $hex = $transaction->sign($fromAddressKey);

        unset($fromAddressKey); return $this->sendRawTransaction('0x' . $hex);
    }
    /**
     * @throws Exception
     */
    private function sendRawTransaction($hex) {
        $query = [
            'module' => 'proxy',
            'action' => 'eth_sendRawTransaction',
            'hex' => $hex,
            'apikey' => $this->apikey,
        ];

        $data = $this->get($query);
        return $data['result'];
    }
    /**
     * 获取账户代币余额
     */
    public function getBalance($contract,$address){
        $query = [
            'module' => 'account',
            'action' => 'tokenbalance',
            'contractaddress' => $contract,
            'address'=>$address,
            'tag'=>'latest',
            'apikey' => $this->apikey,
        ];
        $data = $this->get($query);
        return $data['result'];
    }
    /**
     * 获取交易支付状态
     */
    public function getTxStatus($hash){
        $query = [
            'module' => 'transaction',
            'action' => 'gettxreceiptstatus',
            'txhash' => $hash,
            'apikey' => $this->apikey,
        ];
        $data = $this->get($query);
        return $data['result'];
    }
    /**
     * 获取nonce
     */
    private function getNonce($address) {
        $query = [
            'module' => 'proxy',
            'action' => 'eth_getTransactionCount',
            'address' => $address,
            'tag' => 'pending',
            'apikey' => $this->apikey,
        ];

        $data = $this->get($query);
        return $data['result'];
    }

    /**
     * 请求处理
     */
    private function get($query) {
        $client = new Client();
        $response = $client->get($this->url."api", [
            'query' => $query
        ]);

        if ($response->getStatusCode() != 200) {
            throw new Exception('Web3 接口请求异常');
        }

        return json_decode($response->getBody()->getContents(), true);
    }
}
